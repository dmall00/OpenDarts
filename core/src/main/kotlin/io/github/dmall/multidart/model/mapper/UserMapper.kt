package io.github.dmall.multidart.model.mapper

import io.github.dmall.multidart.entity.User
import io.github.dmall.multidart.model.UserDto
import org.mapstruct.Mapper
import org.mapstruct.factory.Mappers

@Mapper(componentModel = "spring")
interface UserMapper {

    fun dtoToEntity(dto: UserDto): User
}