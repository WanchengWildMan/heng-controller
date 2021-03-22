import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    Logger,
    PipeTransform
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class AuthPipe implements PipeTransform {
    private readonly logger = new Logger("AuthPipe");
    constructor(private readonly vals?: string[]) {}
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (this.vals) {
            //这段必须放前面优先验证vals是否包含传入的值value，如果不是controller中参数不是DTO，则metatype则为空？？
            if (!value)
                throw new BadRequestException(
                    `Validation failed:值应在${this.vals}中但为空！`
                );

            const valueArr = value.split(",");
            const valuesRequired = this.vals;
            valueArr.forEach((v: string) => {
                if (!valuesRequired.includes(v)) {
                    const message = `Validation failed:${v}不属于[${valuesRequired}],参数非法`;
                    this.logger.error(message);
                    throw new BadRequestException(message);
                }
            });
        }
        if (!metatype || !this.toValidate(metatype)) {
            // 如果没有传入验证规则，则不验证，直接返回数据
            return value;
        }
        // 将对象转换为 Class 来验证
        const object = plainToClass(metatype, value);
        const keys = Object.keys(value);
        for (const k of keys) {
            const isNumber: boolean = k.toLowerCase().indexOf("count") != -1;
            //key中含count,则参数名是count，则一定是number类型
            if (isNumber && typeof value[k] != "number") {
                throw new BadRequestException(
                    `Validation failed:${k}应为number类型,但传入${typeof value[
                        k
                    ]}`
                );
            }
        }
        const errors = await validate(object);
        if (errors.length > 0) {
            const msg = Object.values(errors[0])[0]; // 只需要取第一个错误信息并返回即可
            this.logger.error(`Validation failed: ${msg}`);
            throw new BadRequestException(`Validation failed: ${msg}`);
        }
        return value;
    }

    private toValidate(metatype: any): boolean {
        const types: any[] = [String, Boolean, Number];
        return !types.includes(metatype);
    }
}
