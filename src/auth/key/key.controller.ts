import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Logger,
    Param,
    Post,
    Query,
    UseFilters,
    UseGuards,
    UsePipes
} from "@nestjs/common";
import { KeyListsDic, KeyPair, roleType, RoleTypeArr } from "../auth.decl";
import { AuthFilter } from "../auth.filter";
import { RoleSignGuard } from "../auth.guard";
import { AuthPipe } from "../auth.pipe";
import { Roles } from "../decorators/roles.decoraters";
import { KeyPairDto } from "../dto/key.dto";
import { KeyService } from "./key.service";
//TODO 去掉as
@Controller("key")
@UseGuards(RoleSignGuard)
export class KeyController {
    private logger: Logger = new Logger("KeyController");
    constructor(private readonly keyService: KeyService) {}

    /**
     * 生成并添加密钥对到redis中
     *
     */
    @Roles("root")
    @Post("generate")
    @UseFilters(AuthFilter)
    @UsePipes(new AuthPipe(RoleTypeArr))
    generateAddKeyPair(@Query("roles") roles: string | string[]) {
        roles = (roles as string).split(",");
        if (roles.includes(roleType.root)) {
            this.logger.error("无法添加root密钥对!");
            throw new ForbiddenException("无法添加root密钥对!");
        }
        return this.keyService.generateAddKeyPair(roles);
    }
    @Roles("root")
    @Delete("del")
    @UseFilters(AuthFilter)
    @UsePipes(new AuthPipe())
    async deleteKeyPair(
        @Query("ak") ak: string,
        @Query("roles") roles?: string | string[]
    ) {
        if (roles) {
            roles = (roles as string).split(",");
            if (roles.includes(roleType.root)) {
                this.logger.error("无法删除root密钥对!");
                throw new ForbiddenException("无法删除root密钥对!");
            }
        }
        const {
            RemovedRoles: removedRoles,
            SccessNum: sucessNum
        } = await this.keyService.deleteKeyPair(
            ak,
            roles ? (roles as string[]) : undefined
        );
        if (!sucessNum) return "删除失败或密钥对已删除!";
        if (roles) {
            return `ak:${ak}删除${
                removedRoles.length ? removedRoles + "权限成功!" : "0个权限"
            }`;
        } else {
            return `ak:${ak}删除${removedRoles}权限成功!`;
        }
    }
    /**
     * 获取所有key
     */
    @Roles("root")
    @Get("getall")
    async getAllKeyPairs(): Promise<KeyListsDic> {
        return this.keyService.getAllKeyPairs();
    }
    @Roles("root")
    @Get("get")
    async getKeyPairByAK(
        @Query("ak") ak: string,
        @Query("role") role?: string
    ): Promise<KeyPair> {
        return await this.keyService.getKeyPair(ak, role);
    }
    //TODO确认此处是否使用管道？
    @Roles("root")
    @UsePipes(new AuthPipe())
    @Post("add")
    async addKeyPair(@Body() keyPairDto: KeyPairDto): Promise<number> {
        return await this.keyService.addKeyPair(keyPairDto);
    }
    //测试生成的密钥对
    @Get("test/genKey")
    async testGenerateKey(@Query("roles") roles: string | string[]) {
        roles = (roles as string).split(",");
        return await this.keyService.generateKeyPair(roles);
    }
}
